Shader "Custom/URP_XRay"
{
    Properties
    {
        _Color ("X-Ray Color", Color) = (1, 0, 0, 0.5)
    }
    SubShader
    {
        // Vẽ sau tất cả các vật thể đục, nằm ở lớp Transparent
        Tags { "RenderType"="Transparent" "Queue"="Transparent+100" "RenderPipeline"="UniversalPipeline" }
        LOD 100
        
        // ZTest Always là lệnh quyết định việc nhìn xuyên tường
        ZTest Always 
        ZWrite Off
        Blend SrcAlpha OneMinusSrcAlpha

        Pass
        {
            Name "Unlit"
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
            };

            CBUFFER_START(UnityPerMaterial)
                half4 _Color;
            CBUFFER_END

            Varyings vert (Attributes input)
            {
                Varyings output;
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                return output;
            }

            half4 frag (Varyings input) : SV_Target
            {
                return _Color;
            }
            ENDHLSL
        }
    }
}